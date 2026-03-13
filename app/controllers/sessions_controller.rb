class SessionsController < ApplicationController
    def create
        user = User.find_by(email: user_params[:email])
        if user && user.authenticate(user_params[:password])
            redirect_to "/dashboard"
        else
            flash[:alert] = "Invalid email or password"
            redirect_to "/login", alert: "Invalid email or password"
        end
    end

    def user_params
        params.permit(:email, :password)
    end
end
